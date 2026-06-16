package com.scm.config;

import com.scm.entity.Customer;
import com.scm.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CustomerRepository customerRepository;

    @Override
    public void run(String... args) {
        if (customerRepository.count() == 0) {
            // 初始化一些示例客户数据
            Customer company1 = new Customer();
            company1.setName("北京主体企业有限公司");
            company1.setAddress("北京市朝阳区建国路88号");
            company1.setUnifiedCreditCode("91110000MA001ABC12");
            company1.setContactPerson("张三");
            company1.setContactPhone("13800138001");
            company1.setRegion("北京");
            company1.setIndustry("贸易");
            customerRepository.save(company1);

            Customer company2 = new Customer();
            company2.setName("上海供应商A");
            company2.setAddress("上海市浦东新区张江高科技园区");
            company2.setUnifiedCreditCode("91310000MA002DEF34");
            company2.setContactPerson("李四");
            company2.setContactPhone("13900139002");
            company2.setRegion("上海");
            company2.setIndustry("制造业");
            customerRepository.save(company2);

            Customer company3 = new Customer();
            company3.setName("深圳供应商B");
            company3.setAddress("深圳市南山区科技园");
            company3.setUnifiedCreditCode("91440000MA003GHI56");
            company3.setContactPerson("王五");
            company3.setContactPhone("13700137003");
            company3.setRegion("深圳");
            company3.setIndustry("制造业");
            customerRepository.save(company3);

            Customer company4 = new Customer();
            company4.setName("广州客户A");
            company4.setAddress("广州市天河区珠江新城");
            company4.setUnifiedCreditCode("91440100MA004JKL78");
            company4.setContactPerson("赵六");
            company4.setContactPhone("13600136004");
            company4.setRegion("广州");
            company4.setIndustry("零售");
            customerRepository.save(company4);

            Customer company5 = new Customer();
            company5.setName("杭州客户B");
            company5.setAddress("杭州市西湖区文三路");
            company5.setUnifiedCreditCode("91330100MA005MNO90");
            company5.setContactPerson("孙七");
            company5.setContactPhone("13500135005");
            company5.setRegion("杭州");
            company5.setIndustry("电子商务");
            customerRepository.save(company5);

            System.out.println("Sample customer data initialized!");
        }
    }
}
